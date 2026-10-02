import QRCode from 'qrcode';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  value,
  size = 120,
  backgroundColor = '#FFFFFF',
  color = '#000000',
}) => {
  const [qrMatrix, setQrMatrix] = useState<number[][]>([]);

  useEffect(() => {
    generateQRMatrix();
  }, [value]);

  const generateQRMatrix = async () => {
    try {
      // Generate QR code as a 2D array
      const qr = await QRCode.create(value, { errorCorrectionLevel: 'M' });
      const modules = qr.modules;
      const matrix: number[][] = [];
      
      for (let row = 0; row < modules.size; row++) {
        const rowData: number[] = [];
        for (let col = 0; col < modules.size; col++) {
          rowData.push(modules.get(row, col) ? 1 : 0);
        }
        matrix.push(rowData);
      }
      
      setQrMatrix(matrix);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  if (qrMatrix.length === 0) {
    return (
      <View style={[styles.container, { width: size, height: size, backgroundColor }]} />
    );
  }

  const moduleSize = size / qrMatrix.length;

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background */}
        <Rect
          x={0}
          y={0}
          width={size}
          height={size}
          fill={backgroundColor}
        />
        
        {/* QR Code modules */}
        {qrMatrix.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            if (cell === 1) {
              return (
                <Rect
                  key={`${rowIndex}-${colIndex}`}
                  x={colIndex * moduleSize}
                  y={rowIndex * moduleSize}
                  width={moduleSize}
                  height={moduleSize}
                  fill={color}
                />
              );
            }
            return null;
          })
        )}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default QRCodeGenerator;

